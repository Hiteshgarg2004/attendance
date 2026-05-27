import { useState, useEffect } from 'react'
import API from '../api/apiClient'


export default function AttendanceSheet({ classId }){
const [students, setStudents] = useState([])
const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const [date, setDate] = useState(getLocalDateString())
const [presentMap, setPresentMap] = useState({})


useEffect(()=>{
async function load(){
try {
const s = await API.get('/students', { params: { classId } })
setStudents(s.data)
const att = await API.get('/attendance', { params: { classId, date } })
if(att?.data?.records){
const map = {}
att.data.records.forEach(r=>{
  // Handle both cases: r.student could be an object or a string
  const studentId = r.student?._id || r.student;
  if (studentId) {
    map[studentId] = r.present;
  }
})
setPresentMap(map)
}
} catch(err) {
console.error("Error loading attendance:", err);
}
}
load()
}, [classId, date])


const toggle = id => setPresentMap(pm => ({ ...pm, [id]: !pm[id] }))
const save = async () => {
const records = students.map(st => ({ studentId: st._id, present: !!presentMap[st._id] }))
// Use /mark endpoint which correctly handles date filtering
await API.post('/attendance/mark', { classId, date, records })
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