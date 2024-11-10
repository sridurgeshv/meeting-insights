import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Dashboard = () => {
  const [meetingData, setMeetingData] = useState({
    title: '',
    type: '',
    summary: '',
    actionItems: [],
    decisions: [],
    questions: []
  });

  return (
    <div className="p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Current Meeting</h3>
              <p className="text-sm text-gray-500">{meetingData.title || 'No active meeting'}</p>
              <p className="text-sm text-gray-500">Type: {meetingData.type || 'Unclassified'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {meetingData.actionItems.map((item, index) => (
                <li key={index} className="text-sm">
                  • {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {meetingData.decisions.map((decision, index) => (
                <li key={index} className="text-sm">
                  • {decision}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;