import { bundleMDX } from "mdx-bundler";

export const getTextAsMdx = async (text: string): Promise<any> => {
  const source = text.trim();

  try {
    const result = await bundleMDX({
      source
    });
    return { code: result.code };
  } catch (err) {
    return { error: (err as Error).message };
  }
};
