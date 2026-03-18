const Student = require('../models/Student');
const xlsx = require('xlsx');
const fs = require('fs');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new student
exports.createStudent = async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Excel file
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Remove the temporary file
    fs.unlinkSync(req.file.path);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // Validate and process each row
    const students = [];
    for (const row of data) {
      if (!row.studentId || !row.name || !row.enrollmentNo) {
        continue; // Skip invalid rows
      }

      // Check if student with same ID already exists
      const existingStudent = await Student.findOne({ studentId: row.studentId });
      if (existingStudent) {
        // Update existing student
        existingStudent.name = row.name;
        existingStudent.enrollmentNo = row.enrollmentNo;
        existingStudent.contactNo = row.contactNo || '';
        existingStudent.email = row.email || '';
        existingStudent.address = row.address || '';
        existingStudent.active = row.active !== undefined ? row.active : true;
        await existingStudent.save();
        students.push(existingStudent);
      } else {
        // Create new student
        const newStudent = new Student({
          studentId: row.studentId,
          name: row.name,
          enrollmentNo: row.enrollmentNo,
          contactNo: row.contactNo || '',
          email: row.email || '',
          address: row.address || '',
          active: row.active !== undefined ? row.active : true
        });
        await newStudent.save();
        students.push(newStudent);
      }
    }

    res.status(200).json({
      message: `${students.length} students processed successfully`,
      students
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export to Excel
exports.exportToExcel = async (req, res) => {
  try {
    const students = await Student.find();
    
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(students.map(student => ({
      studentId: student.studentId,
      name: student.name,
      enrollmentNo: student.enrollmentNo,
      contactNo: student.contactNo,
      email: student.email,
      address: student.address,
      active: student.active
    })));
    
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};