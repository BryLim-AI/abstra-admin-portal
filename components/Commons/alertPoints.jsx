import React from "react";

const PointsEarnedAlert = ({ points }) => {
    if (!points || points <= 0) return null;

    return (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded shadow-lg z-50 animate-slide-in">
            <strong className="font-bold">🎉 You earned {points} points!</strong>
            <p className="text-sm">You can use your points for rewards or benefits.</p>
        </div>
    );
};

export default PointsEarnedAlert;