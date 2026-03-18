import { Routes, Route } from 'react-router-dom';
import CodeList from './CodeList';
import EditCode from './EditCode';
import SubjectList from './SubjectList';
import EditSubject from './EditSubject';
import CourseList from './CourseList';
import EditCourse from './EditCourse';

export { CodeList, EditCode, SubjectList, EditSubject, CourseList, EditCourse };

export default function MasterDataSection() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="container mx-auto">
        <Routes>
          <Route path="/" element={<CodeList />} />
          <Route path="/code" element={<CodeList />} />
          <Route path="/code/edit/:id" element={<EditCode />} />
          <Route path="/subject" element={<SubjectList />} />
          <Route path="/subject/edit/:id" element={<EditSubject />} />
          <Route path="/course" element={<CourseList />} />
          <Route path="/course/edit/:id" element={<EditCourse />} />
        </Routes>
      </div>
    </div>
  );
}