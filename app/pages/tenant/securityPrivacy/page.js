"use client";

import SideNavProfile from "../../../../components/navigation/sidebar-profile";
import SecurityPage from "../../../../components/Commons/securityPrivacy";
//  to be rmoved direct ro compoent no need to be like this.
export default function userSecurityPrivacy() {
    return ( 
    <div className="flex flex-col md:flex-row min-h-screen">
          <SideNavProfile/>
        <div className="flex-grow">
          <SecurityPage/>
        </div>
      </div> 

    );
}