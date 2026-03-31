"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { todayISO, cn } from "@/lib/utils";

type Angle = "front" | "side" | "back";

export default function UploadPhotoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultAngle = (searchParams.get("angle") as Angle) || "front";
  const defaultDate = searchParams.get("date") || todayISO();

  const [angle, setAngle] = useState<Angle>(defaultAngle);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file) return;
    setUploading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    // Compress image client-side
    const compressed = await compressImage(file, 800);

    const key = `${user.id}/${defaultDate}-${angle}-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("progress-photos")
      .upload(key, compressed, { contentType: "image/jpeg" });

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    await supabase.from("progress_photos").insert({
      user_id: user.id,
      storage_key: key,
      angle,
      taken_at: defaultDate,
    });

    router.push("/progress/photos");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-[var(--color-muted)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Add Progress Photo</h1>
      </div>

      {/* Angle selector */}
      <div className="flex gap-2">
        {(["front", "side", "back"] as Angle[]).map((a) => (
          <button
            key={a}
            onClick={() => setAngle(a)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
              angle === a
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-raised)] text-[var(--color-muted-foreground)]"
            )}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Photo area */}
      <div
        className="aspect-[3/4] rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-[var(--color-muted)]">
            <Camera className="w-12 h-12" />
            <p className="text-sm">Tap to take or upload photo</p>
            <p className="text-xs text-center px-8">
              Stand in front of a plain wall. Same position each time for best comparison.
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview && (
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); setFile(null); }}>
            Retake
          </Button>
          <Button className="flex-1 gap-2" loading={uploading} onClick={upload}>
            <Upload className="w-4 h-4" />
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

async function compressImage(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
    };
    img.src = url;
  });
}
