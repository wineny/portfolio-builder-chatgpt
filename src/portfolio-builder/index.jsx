import { createRoot } from "react-dom/client";
import App from "./portfolio-builder";

createRoot(document.getElementById("portfolio-builder-root")).render(<App />);

export { App };
export default App;
