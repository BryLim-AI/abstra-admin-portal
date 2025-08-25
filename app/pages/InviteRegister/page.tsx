'use client';

import useAuthStore from '@/zustand/authStore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';

 function TenantInviteJoinPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const inviteCode = searchParams.get('invite');

    const { user, admin, loading, fetchSession } = useAuthStore();

    const [inviteDetails, setInviteDetails] = useState<any>(null);
    const [expired, setExpired] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(true);

    // useEffect(() => {
    //     // Always fetch session first
    //     fetchSession().then(() => {
    //         if (!loading && !user) {
    //             const currentPath = window.location.pathname;
    //             router.push(`/pages/auth/login?redirect=${encodeURIComponent(currentPath)}`);
    //         }
    //     });
    // }, [user, loading, fetchSession, router]);


    useEffect(() => {
        async function fetchInviteDetails() {
            try {
                const res = await fetch(`/api/invite/${inviteCode}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setInviteDetails(data.invite);
            } catch {
                setExpired(true);
            } finally {
                setLoadingInvite(false);
            }
        }

        if (inviteCode) {
            fetchInviteDetails();
        }
    }, [inviteCode]);

    const handleJoin = async () => {
        if (!user) return;

        try {
            const res = await fetch('/api/invite/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inviteCode,
                    userId: user.user_id,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/pages/tenant/my-unit');
            } else {
                alert(data.error || 'Failed to join unit.');
            }
        } catch (error) {
            console.error('Join failed:', error);
            alert('An error occurred while joining the unit.');
        }
    };


    if (loading || loadingInvite) return <div className="p-4 text-center">Loading...</div>;

    if (expired || !inviteDetails) {
        return (
            <div className="p-4 text-center text-red-600">
                Invite link is invalid or has expired.
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded text-center">
            <h1 className="text-2xl font-bold mb-2">You're invited to join</h1>
            <p className="text-lg mb-4 font-medium">{inviteDetails.property_name}</p>
            <p className="mb-6">Unit: <strong>{inviteDetails.unit_name}</strong></p>
            <button
                onClick={handleJoin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
                Join Unit
            </button>
        </div>
    );
}


export default function InviteRegisterPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Loading invite...</div>}>
            <TenantInviteJoinPage />
        </Suspense>
    );
}