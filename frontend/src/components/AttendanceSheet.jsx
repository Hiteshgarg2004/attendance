import { useState, useEffect } from 'react'
import API from '../api/apiClient'


export default function AttendanceSheet({ classId }){
const [students, setStudents] = useState([])
const [date, setDate] = useState(new Date().toISOString().slice(0,10))
const [presentMap, setPresentMap] = useState({})


useEffect(()=>{
async function load(){
const s = await API.get('/students', { params: { classId } })
setStudents(s.data)
const att = await API.get('/attendance', { params: { classId, date } }).catch(()=>null)
if(att?.data?.records){
const map = {}
att.data.records.forEach(r=>map[r.student._id || r.student] = r.present)
setPresentMap(map)
}
}
load()
}, [classId, date])


const toggle = id => setPresentMap(pm => ({ ...pm, [id]: !pm[id] }))
const save = async () => {
const records = students.map(st => ({ studentId: st._id, present: !!presentMap[st._id] }))
await API.post('/attendance', { classId, date, records })
alert('Saved!')
}


return (
<div className="space-y-4">
<div className="flex gap-2 items-center">
<label>Date</label>
<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border p-1 rounded" />
<button onClick={save} className="bg-green-500 text-white px-3 py-1 rounded">Save</button>
</div>
<table className="min-w-full bg-white rounded shadow">
<thead>
<tr className="bg-gray-200 text-left">
<th className="p-2">Roll</th>
<th className="p-2">Name</th>
<th className="p-2">Present</th>
</tr>
</thead>
<tbody>
{students.map(st=>(
<tr key={st._id} className="border-b">
<td className="p-2">{st.rollNumber}</td>
<td className="p-2">{st.name}</td>
<td className="p-2"><input type="checkbox" checked={!!presentMap[st._id]} onChange={()=>toggle(st._id)} /></td>
</tr>
))}
</tbody>
</table>
</div>
)
}