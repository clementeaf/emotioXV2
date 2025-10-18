import React from 'react';
import Card from './Card';
import type { MainContentProps } from './types';

const MainContent: React.FC<MainContentProps> = ({
  children,
  layout = 'single',
  leftContent,
  rightContent
}) => {
  if (layout === 'single') {
    return (
      <Card className="flex-1" padding="lg">
        {children && (
          <div>
            {children}
          </div>
        )}
      </Card>
    );
  }

  if (layout === 'double') {
    return (
      <div className="flex-1 flex gap-4">
        <Card className="w-80" padding="lg">
          {leftContent && (
            <div>
              {leftContent}
            </div>
          )}
        </Card>

        <Card className="flex-1" padding="lg">
          {rightContent && (
            <div>
              {rightContent}
            </div>
          )}
        </Card>
      </div>
    );
  }

  return null;
};

export default MainContent;
