import React, { useEffect } from "react";
import {
    CometChatUIKit,
    UIKitSettingsBuilder,
} from "@cometchat/chat-uikit-react";
import { setupLocalization } from "../utils/utils";
import { CometChatProvider } from "../context/CometChatContext";
import CometChatApp from "../CometChatApp";

export const COMETCHAT_CONSTANTS = {
    APP_ID: "280012fb7a508cca", // Replace with your App ID
    REGION: "IN", // Replace with your App Region
    AUTH_KEY: "7344b7e875cd1d51cb99f37ca1799c7f907d7ffe", // Replace with your Auth Key or leave blank if you are authenticating using Auth Token
};

// Functional Component
const CometChatNoSSR: React.FC = () => {
    useEffect(() => {
        // Initialize UIKit settings
        const UIKitSettings = new UIKitSettingsBuilder()
            .setAppId(COMETCHAT_CONSTANTS.APP_ID)
            .setRegion(COMETCHAT_CONSTANTS.REGION)
            .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
            .subscribePresenceForAllUsers()
            .build();

        // Initialize CometChat UIKit
        CometChatUIKit.init(UIKitSettings)
            ?.then(() => {
                setupLocalization();
                console.log("Initialization completed successfully");
                CometChatUIKit.getLoggedinUser().then((loggedInUser) => {
                    if (!loggedInUser) {
                        CometChatUIKit.login("cometchat-uid-1")
                            .then((user) => {
                                console.log("Login Successful", { user });
                            })
                            .catch((error) => console.error("Login failed", error));
                    } else {
                        console.log("Already logged-in", { loggedInUser });
                    }
                });
            })
            .catch((error) => console.error("Initialization failed", error));
    }, []);

    return (
        /* The CometChatApp component requires a parent element with an explicit height and width
       to render properly. Ensure the container has defined dimensions, and adjust them as needed
       based on your layout requirements. */
        <div style={{ width: "100vw", height: "100dvh" }}>
            <CometChatProvider>
                <CometChatApp />
            </CometChatProvider>
        </div>
    );
};

export default CometChatNoSSR;