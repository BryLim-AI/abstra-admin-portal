import {
FaPowerOff,
FaMotorcycle,
FaGamepad 
} from "react-icons/fa";
import {
  MdDirectionsCar,
  MdPool,
  MdFitnessCenter,
  MdSchool,
  MdElevator
} from "react-icons/md";
import { GiPoolTableCorner } from "react-icons/gi";
import { LuCctv } from "react-icons/lu";
import { IoIosBicycle } from "react-icons/io";
import { PiSolarRoof } from "react-icons/pi";

export const AMENITIES_LIST = [
  { name: "Pool", icon: <MdPool /> },
  { name: "Gym", icon: <MdFitnessCenter /> },
  { name: "Pool Tables", icon: <GiPoolTableCorner /> },
  { name: "Study Hub", icon: <MdSchool /> },
  { name: "Car Parking", icon: <MdDirectionsCar /> },
  { name: "CCTV Surveillance", icon: <LuCctv />},
  { name: "Elevator", icon: <MdElevator />},
  { name: "Emergency Power/Generator", icon: <FaPowerOff />},
  { name: "Motorcycle Parking", icon: <FaMotorcycle  />},
  { name: "Bicycle Parking", icon: <IoIosBicycle />},
  { name: "Rooftop Deck", icon: <PiSolarRoof />},
  { name: "Game Room", icon: <FaGamepad  />},


];
