import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const data = [
    { month: "Jan", revenue: 4000 },
    { month: "Feb", revenue: 3000 },
    { month: "Mar", revenue: 5000 },
    { month: "Apr", revenue: 4500 },
    { month: "May", revenue: 6000 },
]

export default function RevenueChart() {

    return (

        <div className="bg-white shadow rounded-lg p-5">

            <h2 className="font-semibold mb-4">
                Monthly Revenue
            </h2>

            <ResponsiveContainer width="100%" height={250}>

                <LineChart data={data}>

                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={3}
                    />

                </LineChart>

            </ResponsiveContainer>

        </div>

    )

}