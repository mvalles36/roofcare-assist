import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/supabase';
import SalesProcessKPIs from '../components/SalesProcessKPIs';

const ProjectManagerDashboard = () => {
  const { data: projectStatus, isLoading, error } = useQuery({
    queryKey: ['projectStatus'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_status');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error loading dashboard: {error.message}</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Project Manager Dashboard</h1>
      <SalesProcessKPIs />
      <Card>
        <CardHeader>
          <CardTitle>Project Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="project_count" fill="#8884d8" name="Number of Projects" />
              <Bar dataKey="total_value" fill="#82ca9d" name="Total Value" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectManagerDashboard;
