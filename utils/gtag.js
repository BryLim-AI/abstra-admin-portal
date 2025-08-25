import ReactGA from "react-ga4";

export const initGA = () => {
    if (typeof window !== "undefined") {
        ReactGA.initialize(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
    }
};

export const logPageView = () => {
    if (typeof window !== "undefined") {
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
};

export const logEvent = (category, action, label, value) => {
    if (typeof window !== "undefined") {
        ReactGA.event({ category, action, label, value });
    }
};