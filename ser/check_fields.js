const http = require('http');
http.get('http://localhost:3636/api/resource/DocField?fields=["fieldname","fieldtype","max_length"]&filters=[["parent","=","Job Applicant"]]&limit_page_length=200', res => {
    let data = '';
    res.on('data', c => data+=c);
    res.on('end', () => console.log(JSON.parse(data).data.map(d => d.fieldname).join(', ')));
});
