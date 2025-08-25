"use client";

import SideNavProfile from "../../../../components/navigation/sidebar-profile";
import ProfilePage from "../../../../components/Commons/profilePage";


export default function userProfile() {
    return ( 
    <div className="flex flex-col md:flex-row min-h-screen">
          <SideNavProfile/>
          <div className="flex-grow">
            <ProfilePage />
          </div>
        </div>
    );
}