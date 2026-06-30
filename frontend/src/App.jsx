import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Notifications from './pages/Notifications';
import TeacherAssignmentList from './pages/teacher/AssignmentList';
import TeacherAssignmentCreate from './pages/teacher/AssignmentCreate';
import TeacherSubmissionList from './pages/teacher/SubmissionList';
import TeacherGradePanel from './pages/teacher/GradePanel';
import TeacherStatistics from './pages/teacher/Statistics';
import TeacherClassManagement from './pages/teacher/ClassManagement';
import TeacherCourseManagement from './pages/teacher/CourseManagement';
import TeacherCourseCreate from './pages/teacher/CourseCreate';
import TeacherClassDetail from './pages/teacher/ClassDetail';
import TeacherCourseDetail from './pages/teacher/CourseDetail';
import StudentAssignmentList from './pages/student/AssignmentList';
import StudentSubmitPage from './pages/student/SubmitPage';
import StudentHistory from './pages/student/History';
import StudentGradeView from './pages/student/GradeView';
import StudentCourseList from './pages/student/CourseList';

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/teacher/assignments' : '/student/assignments'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/teacher" element={<PrivateRoute role="teacher"><Layout /></PrivateRoute>}>
        <Route path="assignments" element={<TeacherAssignmentList />} />
        <Route path="assignments/new" element={<TeacherAssignmentCreate />} />
        <Route path="assignments/:id/edit" element={<TeacherAssignmentCreate />} />
        <Route path="assignments/:id/submissions" element={<TeacherSubmissionList />} />
        <Route path="assignments/:id/grade/:sid" element={<TeacherGradePanel />} />
        <Route path="courses" element={<TeacherCourseManagement />} />
        <Route path="courses/new" element={<TeacherCourseCreate />} />
        <Route path="courses/:id/edit" element={<TeacherCourseCreate />} />
        <Route path="courses/:id" element={<TeacherCourseDetail />} />
        <Route path="classes" element={<TeacherClassManagement />} />
        <Route path="classes/:id" element={<TeacherClassDetail />} />
        <Route path="statistics" element={<TeacherStatistics />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="/student" element={<PrivateRoute role="student"><Layout /></PrivateRoute>}>
        <Route path="assignments" element={<StudentAssignmentList />} />
        <Route path="assignments/:id/submit" element={<StudentSubmitPage />} />
        <Route path="courses" element={<StudentCourseList />} />
        <Route path="history" element={<StudentHistory />} />
        <Route path="grades" element={<StudentGradeView />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
