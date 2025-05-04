                    <ProgressSidebar
                        steps={participantFlowSteps}
                        currentStepIndex={currentStepIndex}
                        onStepClick={handleStepClick}
                        completedStepsCount={completedRelevantSteps}
                        totalStepsCount={totalRelevantSteps}
                    />
                    
                    <div className="w-full">
                        <CurrentStepRenderer
                            stepType={currentExpandedStep.type}
                            stepConfig={currentExpandedStep.config}
                            stepId={currentExpandedStep.id}
                            stepName={currentExpandedStep.name}
                            researchId={researchId}
                            token={token}
                            onLoginSuccess={handleLoginSuccess}
                            onStepComplete={handleStepComplete}
                            onError={(message, step) => handleError(message, step as ParticipantFlowStep)}
                        />
                    </div>
                </> 