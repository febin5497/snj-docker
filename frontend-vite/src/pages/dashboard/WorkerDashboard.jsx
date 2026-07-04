import { Link } from "react-router-dom"
export default function WorkerDashboard(){
return(
<div className="p-6 theme-blue-white min-h-screen">
<h1 className="text-2xl font-bold mb-6" style={{ color: '#0052CC' }}>
Worker Panel
</h1>
<div className="grid grid-cols-2 gap-6">
<Link
to="/attendance"
className="bg-blue-600 text-white p-6 rounded btn-blue-white hover:shadow-lg transition-all"
>
Attendance
</Link>
<Link
to="/tasks"
className="bg-blue-600 text-white p-6 rounded btn-blue-white hover:shadow-lg transition-all"
>
My Tasks
</Link>
<Link
to="/site-photos"
className="bg-blue-600 text-white p-6 rounded btn-blue-white hover:shadow-lg transition-all"
>
Upload Site Photo
</Link>
</div>
</div>
)
}