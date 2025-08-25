"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import SecurityPage from "../../../../components/Commons/securityPrivacy";
import SideNavProfile from "../../../../components/navigation/sidebar-profile";

export default function LandlordSecurityPrivacy() {
  return (
  <div className="flex flex-col md:flex-row min-h-screen">
      <SideNavProfile/>
    <div className="flex-grow">
      <SecurityPage/>
    </div>
  </div> 
  );
}
