'use client';
import { useRouter } from 'next/navigation';
import { MdOutlineRssFeed } from "react-icons/md";

import Link from 'next/link';
import {
    HomeIcon,
    ClockIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import { FaFile } from 'react-icons/fa';
import { RiCommunityFill } from "react-icons/ri";

export default function TenantOutsidePortalNav() {
    const router = useRouter();
    const handleClick_MyApplications = () => {
        router.push('/pages/tenant/myApplications');
    };

    const handleMyUnitsClick = () => {
        router.push('/pages/tenant/my-unit');
    };

    const handleFeedClick = () => {
        router.push('/pages/tenant/feeds');
    };

    return (
        <div className="hidden w-64 border-r border-gray-200 bg-white py-6 px-4 md:block">
            <div className="mb-8">
                <h2 className="text-xl font-bold text-indigo-900">My Rental</h2>
                <p className="text-sm text-gray-500">Manage your rental property</p>
            </div>

            <nav>
                <ul className="space-y-2">
                    <li>
                        <button
                            onClick={handleFeedClick}
                            className="flex w-full items-center space-x-3 rounded-md p-3 text-left text-gray-700 hover:bg-gray-100"
                        >
                            <MdOutlineRssFeed className="h-5 w-5" />
                            <span>Feeds</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={handleMyUnitsClick}
                            className="flex w-full items-center space-x-3 rounded-md p-3 text-left text-gray-700 hover:bg-gray-100"
                        >
                            <RiCommunityFill className="h-5 w-5" />
                            <span>My Units</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={handleClick_MyApplications}
                            className="flex w-full items-center space-x-3 rounded-md p-3 text-left text-gray-700 hover:bg-gray-100"
                        >
                            <FaFile className="h-5 w-5" />
                            <span>My Applications</span>
                        </button>
                    </li>
                    <li>
                        <Link
                            href="#"
                            className="flex items-center space-x-3 rounded-md p-3 text-gray-700 hover:bg-gray-100"
                        >
                            <ClockIcon className="h-5 w-5" />
                            <span>Unit History</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
