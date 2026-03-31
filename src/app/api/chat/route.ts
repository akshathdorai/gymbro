import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, COACH_MODEL, MAX_TOKENS } from "@/lib/anthropic/client";
import { coachTools } from "@/lib/anthropic/tools";
import { buildCoachSystemPrompt } from "@/lib/anthropic/system-prompt";
import { executeTool } from "@/lib/anthropic/tool-handlers";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

export const runtime = "edge";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await request.json() as { messages: MessageParam[] };

  // Fetch user context for system prompt
  const [profileRes, targetsRes, programRes] = await Promise.all([
    supabase.from("user_profile").select("*").eq("id", user.id).single(),
    supabase.from("user_targets").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("program").select("*, phase_number, week_number").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
  ]);

  const systemPrompt = buildCoachSystemPrompt({
    profile: profileRes.data!,
    targets: targetsRes.data!,
    program: programRes.data,
    currentWeek: programRes.data?.week_number || 1,
    currentPhase: programRes.data?.phase_number || 1,
  });

  // Stream with SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: data })}\n\n`));
      }
      function sendEvent(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`));
      }

      try {
        let conversationMessages = [...messages];

        // Agentic loop: keep going until stop_reason is "end_turn"
        let iterations = 0;
        while (iterations < 5) {
          iterations++;

          const response = await anthropic.messages.create({
            model: COACH_MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            tools: coachTools,
            messages: conversationMessages,
            stream: true,
          });

          let fullText = "";
          const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
          let currentToolUse: { id: string; name: string; inputJson: string } | null = null;
          let stopReason = "";

          for await (const event of response) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                currentToolUse = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  inputJson: "",
                };
                sendEvent("tool_start", { name: event.content_block.name });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                send(event.delta.text);
                fullText += event.delta.text;
              } else if (event.delta.type === "input_json_delta" && currentToolUse) {
                currentToolUse.inputJson += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop") {
              if (currentToolUse) {
                const toolInput = JSON.parse(currentToolUse.inputJson || "{}");
                toolUseBlocks.push({
                  id: currentToolUse.id,
                  name: currentToolUse.name,
                  input: toolInput,
                });
                currentToolUse = null;
              }
            } else if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason || "";
            }
          }

          // Add assistant turn to conversation
          const assistantContent: MessageParam["content"] = [];
          if (fullText) assistantContent.push({ type: "text", text: fullText });
          toolUseBlocks.forEach((t) => {
            assistantContent.push({ type: "tool_use", id: t.id, name: t.name, input: t.input });
          });

          conversationMessages.push({
            role: "assistant",
            content: assistantContent,
          });

          // If tool use, execute and continue
          if (stopReason === "tool_use" && toolUseBlocks.length > 0) {
            const toolResults: MessageParam["content"] = [];

            for (const tool of toolUseBlocks) {
              sendEvent("tool_executing", { name: tool.name });
              const result = await executeTool(tool.name, tool.input, user.id);
              sendEvent("tool_done", { name: tool.name });
              toolResults.push({
                type: "tool_result",
                tool_use_id: tool.id,
                content: result,
              });
            }

            conversationMessages.push({ role: "user", content: toolResults });
            // Continue the loop for next Claude turn
          } else {
            // end_turn — done
            break;
          }
        }

        // Persist the final messages to DB
        const userMsg = messages[messages.length - 1];
        const assistantFinalText = conversationMessages
          .filter((m) => m.role === "assistant")
          .map((m) => {
            if (typeof m.content === "string") return m.content;
            return (m.content as Array<{ type: string; text?: string }>)
              .filter((c) => c.type === "text")
              .map((c) => c.text)
              .join("");
          })
          .join("\n");

        await Promise.all([
          supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: typeof userMsg.content === "string" ? userMsg.content : JSON.stringify(userMsg.content) }),
          supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: assistantFinalText }),
        ]);

        sendEvent("done", {});
      } catch (err) {
        sendEvent("error", { message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET(request: Request) {
  // Return last 50 messages for hydration
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50);

  return NextResponse.json({ messages: data || [] });
}
