'use client';

import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';

type UtilityRate = {
    property_id: number;
    utility_type: 'water' | 'electricity';
    avg_rate_consumed: number;
};

type Props = {
    landlordId: number | string;
};

export default function PropertyUtilitiesChart({ landlordId }: Props) {
    const [utilityRates, setUtilityRates] = useState<UtilityRate[]>([]);

    useEffect(() => {
        if (!landlordId) return;

        fetch(`/api/analytics/landlord/getAveragePropertyUtilityRate?landlord_id=${landlordId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log('Average Utility Rate Data:', data);
                setUtilityRates(data);
            })
            .catch((error) => console.error('Error fetching utility rate data:', error));
    }, [landlordId]);

    const propertyIds = [...new Set(utilityRates.map((item) => item.property_id))];

    const waterRates = propertyIds.map(
        (id) =>
            utilityRates.find(
                (item) => item.property_id === id && item.utility_type === 'water'
            )?.avg_rate_consumed || 0
    );

    const electricityRates = propertyIds.map(
        (id) =>
            utilityRates.find(
                (item) => item.property_id === id && item.utility_type === 'electricity'
            )?.avg_rate_consumed || 0
    );

    const chartOptionsPropertyUtilities = {
        chart: { type: 'bar' },
        xaxis: { categories: propertyIds.map((id) => `Property ${id}`) },
        title: { text: 'Average Utility Rate per Property', align: 'center' },
    };

    const seriesPropertyUtilities = [
        { name: 'Water (cu.m)', data: waterRates },
        { name: 'Electricity (kWh)', data: electricityRates },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Property Utilities</h3>
            {waterRates.length > 0 && electricityRates.length > 0 ? (
                <Chart
                    // @ts-ignore
                    options={chartOptionsPropertyUtilities}
                    series={seriesPropertyUtilities}
                    type="bar"
                    height={350}
                />
            ) : (
                <div className="flex justify-center items-center h-64">
                    <p className="text-gray-500">No data available</p>
                </div>
            )}
        </div>
    );
}
