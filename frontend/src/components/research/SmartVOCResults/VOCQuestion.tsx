import { UserIcon, ClipboardListIcon, KeyboardIcon } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface Comment {
  text: string;
  mood: string;
  selected?: boolean;
}

interface VOCQuestionProps {
  comments: Comment[];
}

export function VOCQuestion({ comments }: VOCQuestionProps) {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">2.6.-Question: Voice of Customer (VOC)</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-700">Short Text question</Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="font-medium text-gray-600">Comment</span>
                  </div>
                </th>
                <th className="p-3 text-left">
                  <span className="font-medium text-gray-600">Mood</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comments.map((comment, index) => (
                <tr key={index} className={comment.selected ? 'bg-blue-50' : ''}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300" 
                        checked={comment.selected}
                        readOnly
                      />
                      <span className="text-sm">{comment.text}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      comment.mood === 'Positive' ? 'bg-green-100 text-green-700' : 
                        comment.mood === 'green' ? 'bg-green-100 text-green-700' : ''
                    }`}>
                      {comment.mood}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="border-b flex">
            <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>Sentiment</span>
            </button>
            <button className="px-4 py-2 text-gray-600 flex items-center gap-2">
              <ClipboardListIcon className="w-4 h-4" />
              <span>Themes</span>
            </button>
            <button className="px-4 py-2 text-gray-600 flex items-center gap-2">
              <KeyboardIcon className="w-4 h-4" />
              <span>Keywords</span>
            </button>
          </div>
          <div className="p-4 h-[340px] overflow-y-auto">
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Sentiment analysis</h4>
              
              <p className="text-sm text-gray-800">
                Then I explore the nature of cognitive developmental improvements in working memory, 
                the role of working memory in learning, and some potential implications of working memory 
                and its development for the education of children and adults.
              </p>
              
              <p className="text-sm text-gray-800">
                The use of working memory is quite ubiquitous in human thought, but the best way to 
                improve education using what we know about working memory is still controversial. 
                I hope to provide some directions for research and educational practice.
              </p>
              
              <h5 className="text-base font-medium mt-6">Accionables:</h5>
              <p className="text-sm text-gray-800">
                Using what we know about working memory is still controversial.
              </p>
              <p className="text-sm text-gray-800">
                I hope to provide some directions for research and educational practice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 