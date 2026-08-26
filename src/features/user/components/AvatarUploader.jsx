import { useRef, useState } from "react";
import { MonkeyAvatarIcon } from "../../../components/ui/MonkeyAvatarIcon.jsx";
import { uploadAvatar } from "../../../lib/services/avatar-service.js";

export function AvatarUploader({ currentUrl, onUploaded }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(currentUrl || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(true);
    const { data, error: uploadError } = await uploadAvatar(file);
    setBusy(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    setPreview(data.avatarUrl);
    onUploaded?.(data.avatarUrl);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface-2 text-muted">
        {preview ? (
          <img className="h-full w-full object-cover" src={preview} alt="" />
        ) : (
          <MonkeyAvatarIcon className="h-12 w-12" />
        )}
      </div>
      <div className="grid gap-1.5">
        <button
          className="ms-button ms-button-secondary w-fit"
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Subiendo..." : "Cambiar foto"}
        </button>
        <input ref={inputRef} className="hidden" type="file" accept="image/*" onChange={handleFileChange} />
        {error ? <p className="m-0 text-xs font-bold text-red">{error}</p> : null}
      </div>
    </div>
  );
}
