"use client";

import ProfilePage from "../../../../components/Commons/profilePage";
import SideNavProfile from "../../../../components/navigation/sidebar-profile";

export default function LandlordProfile() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <SideNavProfile />
      <div className="flex-grow">
        <ProfilePage />
      </div>
    </div>
  );
}
