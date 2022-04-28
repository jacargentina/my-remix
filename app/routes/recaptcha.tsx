import { ExternalScriptsFunction } from "remix-utils";

let scripts: ExternalScriptsFunction = () => {
  return [
    {
      src: "https://www.google.com/recaptcha/api.js"
    }
  ];
};

export const handle = {
  scripts
};

export default function Recaptcha() {
  return (
    <button onClick={() => window.alert(typeof window.grecaptcha)}>Test</button>
  );
}
