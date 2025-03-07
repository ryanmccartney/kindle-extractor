import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import { createTheme, MantineProvider, rem } from "@mantine/core";

import App from "./App.jsx";

const theme = createTheme({
    fontSizes: {
        xs: rem(10),
        sm: rem(11),
        md: rem(14),
        lg: rem(16),
        xl: rem(26),
    },
});

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <MantineProvider theme={theme}>
            <App />
        </MantineProvider>
    </StrictMode>
);
