import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import {LogLevel, PublicClientApplication} from "@azure/msal-browser";
import {MsalProvider} from "@azure/msal-react";

const env: ImportMetaEnv = await import.meta.env;
const AUTHORITY: string = env.VITE_AUTHORITY;
const CLIENT_ID: string = env.VITE_CLIENT_ID;

const msalInstance: PublicClientApplication = new PublicClientApplication(
    {
        auth: {
            authority: AUTHORITY,
            clientId: CLIENT_ID,
            redirectUri: "http://localhost:5173/",
            postLogoutRedirectUri: "http://localhost:5173?logout=true",
        },
        cache: {
            cacheLocation: 'localStorage',
            storeAuthStateInCookie: false,
        },
        system: {
            loggerOptions: {
                loggerCallback(logLevel, message) {
                    console.log(message);
                },
                logLevel: LogLevel.Verbose,
                piiLoggingEnabled: false
            }
        }
    }
);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <MsalProvider instance={msalInstance}>
            <App/>
        </MsalProvider>
    </StrictMode>,
)
