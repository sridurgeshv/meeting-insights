import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit } from 'lucide-react';

const Session = () => {
  const { sessionId } = useParams();
  const [sessionTitle, setSessionTitle] = useState('New Session');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleTitleChange = (event) => {
    setSessionTitle(event.target.value);
  };

  const toggleTitleEdit = () => {
    setIsEditingTitle(!isEditingTitle);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          {isEditingTitle ? (
            <Input
              type="text"
              value={sessionTitle}
              onChange={handleTitleChange}
              className="text-2xl font-bold"
              onBlur={toggleTitleEdit}
              autoFocus
            />
          ) : (
            <div className="flex items-center">
              <span className="text-2xl font-bold">{sessionTitle}</span>
              <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={toggleTitleEdit}>
                <Edit size={20} />
              </button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          rows={8}
          placeholder="Enter session details..."
          className="w-full resize-y"
        />
      </CardContent>
    </Card>
  );
};

export default Session;