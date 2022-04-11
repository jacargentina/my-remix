import { Form } from "@remix-run/react";
import { ActionFunction, json } from "@remix-run/node";
import { getTextAsMdx } from "~/utils.server";

export let action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const text = (body.get("text") as string) || "";
  if (text === "") {
    throw new Error("text es requerido");
  }
  var result = { mdx: await getTextAsMdx(text) };
  console.log(result);
  return json(result);
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      Text:
      <Form method="post">
        <input name="text" id="text" type="text" />
        <button>Convert</button>
      </Form>
    </div>
  );
}
