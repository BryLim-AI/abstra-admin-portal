import {
  FaWifi,
  FaTv,
  FaUtensils,
  FaSnowflake,
  FaShower,
  FaBed,
  FaFan,

} from "react-icons/fa";
import {
  MdDirectionsCar,
  MdPool,
  MdFitnessCenter,
  MdSchool,
} from "react-icons/md";
import { GiPoolTableCorner, GiRiceCooker,GiGasStove   } from "react-icons/gi";
import { PiWashingMachine } from "react-icons/pi";
import { LuRefrigerator,
  LuWashingMachine,
  LuMicrowave,
  } from "react-icons/lu";
import { BiCabinet } from "react-icons/bi";
import { MdBathtub } from "react-icons/md";

export const AMENITIES_LIST_UNIT = [
  { name: "Wifi", icon: <FaWifi /> },
  { name: "TV", icon: <FaTv /> },
  { name: "Kitchen", icon: <FaUtensils /> },
  { name: "Washer", icon: <PiWashingMachine /> },
  { name: "Air Conditioning", icon: <FaSnowflake /> },
  { name: "Shower Heater", icon: <FaShower /> },
  { name: "Bed/Mattress", icon: <FaBed  /> },
  { name: "Electric Fan", icon: <FaFan  /> },
  { name: "Refrigerator", icon: <LuRefrigerator  /> },
  { name: "Washing Machine", icon: <LuWashingMachine  /> },
  { name: "Microwave", icon: <LuMicrowave /> },
  { name: "Rice Cooker", icon: <GiRiceCooker  /> },
  { name: "Gas Stove", icon: <GiGasStove  /> },
  { name: "Cabinet", icon: <BiCabinet /> },
  { name: "BathTub", icon: <MdBathtub /> },
  
];