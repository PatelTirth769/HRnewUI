import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Table, Tag, Space, notification, Empty } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

export default function ESSAttendanceDaily({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [date, setDate] = useState(dayjs());

    const [holidayList, setHolidayList] = useState([]);
    const [checkins, setCheckins] = useState([]);

    useEffect(() => {
        if (employeeData?.name) {
            fetchDailyAttendance();
        }
        if (employeeData?.holiday_list) {
            fetchHolidays();
        } else {
            // Even if no holiday list, we might still want to show Sundays
            checkVirtualStatus();
        }
    }, [employeeData, date, holidayList.length]);

    const checkVirtualStatus = () => {
        const dateStr = date.format('YYYY-MM-DD');
        const isSunday = date.day() === 0;
        const isHoliday = holidayList.includes(dateStr);
        if ((isSunday || isHoliday) && !data) {
            setData({
                status: isSunday ? 'Weekly Off' : 'Holiday',
                attendance_date: dateStr,
                in_time: null,
                out_time: null,
                working_hours: 0,
                shift: 'N/A'
            });
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await API.get(`/api/resource/Holiday List/${encodeURIComponent(employeeData.holiday_list)}`);
            if (res.data.data && res.data.data.holidays) {
                setHolidayList(res.data.data.holidays.map(h => h.holiday_date));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDailyAttendance = async () => {
        if (!employeeData?.name) return;
        setLoading(true);
        try {
            const dateStr = date.format('YYYY-MM-DD');
            const fromTime = `${dateStr} 00:00:00`;
            const toTime = `${dateStr} 23:59:59`;

            const [attRes, checkinRes] = await Promise.all([
                API.get(`/api/resource/Attendance?fields=["name","attendance_date","status","in_time","out_time","working_hours","shift","late_entry","early_exit"]&filters=[["employee","=","${employeeData.name}"],["attendance_date","=","${dateStr}"]]`),
                API.get(`/api/resource/Employee Checkin?fields=["name","time","log_type","device_id"]&filters=[["employee","=","${employeeData.name}"],["time",">=","${fromTime}"],["time","<=","${toTime}"]]&order_by=time asc`)
            ]);
            
            setCheckins(checkinRes.data.data || []);
            const hasCheckins = checkinRes.data.data && checkinRes.data.data.length > 0;
            const isHoliday = holidayList.includes(dateStr);
            const isSunday = date.day() === 0;

            let finalData = null;

            if (attRes.data.data && attRes.data.data.length > 0) {
                finalData = { ...attRes.data.data[0] };
                
                // Handle false positive "Present" when there are NO checkins
                if (finalData.status === 'Present' && !hasCheckins) {
                    if (isSunday) finalData.status = 'Weekly Off';
                    else if (isHoliday) finalData.status = 'Holiday';
                    else finalData.status = 'Absent';
                }
            }

            if (hasCheckins) {
                // Checkins exist -> Status must be Present
                const firstCheckin = checkinRes.data.data[0];
                const lastCheckin = checkinRes.data.data[checkinRes.data.data.length - 1];
                
                finalData = {
                    ...finalData,
                    status: (finalData?.status && finalData.status !== 'Absent') ? finalData.status : 'Present',
                    attendance_date: dateStr,
                    in_time: firstCheckin.time,
                    out_time: lastCheckin.time,
                    working_hours: finalData?.working_hours || 0,
                    shift: finalData?.shift || 'N/A'
                };
                
                // Special tag if it's purely from checkins
                if (!attRes.data.data || attRes.data.data.length === 0) {
                    finalData.is_synthesized = true;
                }
            } else if (!finalData) {
                // No attendance record and no checkins
                if (isHoliday || isSunday) {
                    finalData = {
                        status: isSunday ? 'Weekly Off' : 'Holiday',
                        attendance_date: dateStr,
                        in_time: null,
                        out_time: null,
                        working_hours: 0,
                        shift: 'N/A'
                    };
                }
            }

            setData(finalData);
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to load daily attendance" });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'Present' || status === 'Present (Checkin)') return 'green';
        if (status === 'Absent') return 'red';
        if (status === 'Half Day') return 'orange';
        if (status === 'On Leave') return 'blue';
        if (status === 'Weekly Off' || status === 'Holiday') return 'default';
        return 'orange';
    };

    const checkinColumns = [
        { 
            title: 'Time', 
            dataIndex: 'time', 
            key: 'time',
            render: (t) => dayjs(t).format('HH:mm:ss')
        },
        { 
            title: 'Type', 
            dataIndex: 'log_type', 
            key: 'log_type',
            render: (type) => <Tag color={type === 'IN' ? 'green' : 'red'}>{type}</Tag>
        },
        { 
            title: 'Device', 
            dataIndex: 'device_id', 
            key: 'device_id',
            render: (id) => id || 'Manual'
        }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border flex gap-4 items-center">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Select Date:</div>
                <DatePicker 
                    value={date} 
                    onChange={setDate} 
                    allowClear={false} 
                    format="DD MMM YYYY"
                    className="w-48"
                />
            </div>

            {loading ? (
                <div className="bg-white p-12 text-center rounded-lg border text-gray-400">Loading daily status...</div>
            ) : data ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card size="small" title="Attendance Status" className="shadow-sm">
                            <Tag color={getStatusColor(data.status)} className="text-sm px-3 py-1">
                                {data.status}
                            </Tag>
                            <div className="mt-4 text-xs text-gray-500 italic">
                                {data.status === 'Present (Checkin)' ? 'Synthesized from raw checkins' : `Marked for ${dayjs(data.attendance_date).format('dddd')}`}
                            </div>
                        </Card>
                        
                        <Card size="small" title="Punch Timing" className="shadow-sm">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs text-gray-400">IN:</span>
                                <span className="font-medium">{data.in_time ? dayjs(data.in_time).format('HH:mm') : '--:--'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-400">OUT:</span>
                                <span className="font-medium">{data.out_time ? dayjs(data.out_time).format('HH:mm') : '--:--'}</span>
                            </div>
                        </Card>

                        <Card size="small" title="Work Details" className="shadow-sm">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs text-gray-400">Hours:</span>
                                <span className="font-bold text-blue-600">{data.working_hours ? parseFloat(data.working_hours).toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-400">Shift:</span>
                                <span className="text-xs font-medium text-gray-600">{data.shift || 'N/A'}</span>
                            </div>
                        </Card>

                        <Card size="small" title="Punctuality" className="shadow-sm">
                            <Space direction="vertical" size={2}>
                                {data.late_entry === 1 ? <Tag color="orange">Late Entry</Tag> : (data.status === 'Present' ? <Tag color="gray" className="opacity-50">On Time</Tag> : null)}
                                {data.early_exit === 1 ? <Tag color="magenta">Early Exit</Tag> : (data.status === 'Present' ? <Tag color="gray" className="opacity-50">Full Duration</Tag> : null)}
                                {data.status === 'Present (Checkin)' && <div className="text-[10px] text-gray-400 italic">Processing pending...</div>}
                                {(data.status === 'Absent' || data.late_entry === 1 || data.early_exit === 1) && (
                                    <div className="mt-2 text-center">
                                        <Button 
                                            size="small" 
                                            type="link" 
                                            className="text-[10px] p-0 h-auto"
                                            onClick={() => window.location.hash = '#/employee-self-service/request/attendance-regularise'}
                                        >
                                            → Regularise
                                        </Button>
                                    </div>
                                )}
                            </Space>
                        </Card>
                    </div>

                    {checkins.length > 0 && (
                        <Card size="small" title={`Raw Checkins (${checkins.length})`} className="shadow-sm overflow-hidden">
                            <Table 
                                dataSource={checkins} 
                                columns={checkinColumns} 
                                size="small" 
                                pagination={false}
                                rowKey="name"
                            />
                        </Card>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 p-12 text-center rounded-lg border border-dashed text-gray-400 italic">
                    <Empty description={`No attendance or checkin record found for ${date.format('DD MMM YYYY')}`} />
                </div>
            )}
        </div>
    );
}
