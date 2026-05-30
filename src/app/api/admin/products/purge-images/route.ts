import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const maxDuration = 300;

type StorageItem = {
  name: string;
  id: string | null;
  metadata: unknown | null;
};

function isFolder(item: StorageItem) {
  return item.id === null && item.metadata === null;
}

async function listAllFiles(prefix: string) {
  const supabase = createSupabaseServiceClient();
  const bucket = supabase.storage.from("product-images");
  const files: string[] = [];

  async function walk(path: string) {
    let offset = 0;
    let keepGoing = true;
    while (keepGoing) {
      const { data, error } = await bucket.list(path, { limit: 1000, offset });
      if (error) throw new Error(error.message);
      const items = (data ?? []) as StorageItem[];
      if (items.length === 0) break;

      for (const item of items) {
        const full = `${path}/${item.name}`;
        if (isFolder(item)) {
          await walk(full);
          continue;
        }
        files.push(full);
      }

      if (items.length < 1000) {
        keepGoing = false;
        break;
      }
      offset += items.length;
    }
  }

  await walk(prefix);
  return files;
}

export async function POST() {
  try {
    const supabase = createSupabaseServiceClient();
    const bucket = supabase.storage.from("product-images");

    const files = await listAllFiles("products");
    if (files.length === 0) return NextResponse.json({ deleted: 0 });

    let deleted = 0;
    for (let i = 0; i < files.length; i += 100) {
      const chunk = files.slice(i, i + 100);
      const { error } = await bucket.remove(chunk);
      if (error) {
        return NextResponse.json({ message: error.message, deleted, attempted: files.length }, { status: 500 });
      }
      deleted += chunk.length;
    }

    return NextResponse.json({ deleted });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Gagal menghapus images." },
      { status: 500 },
    );
  }
}
