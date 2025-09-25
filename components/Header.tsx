import { Button, Text, XStack, YStack } from 'tamagui'
import { IconComp } from './IconComp'
import { UseCaseSheet } from './UseCaseSheet'
import { ControllerStep, UseCase } from 'types'

export function Header({ 
  currentUseCase,
  setShowUseCaseSheet,
  showUseCaseSheet,
  handleUseCaseSelect,
  setCurrentStep
}: { 
  currentUseCase: UseCase;
  setShowUseCaseSheet: (open: boolean) => void;
  showUseCaseSheet: boolean;
  handleUseCaseSelect: (useCase: UseCase) => void;
  setCurrentStep: (step: ControllerStep) => void;
}) {
  return (
    <>
    <XStack jc='space-between' ai='center' mb={10} px={20} py={10}>
      <Button
        size="$3"
        theme="alt2"
        onPress={() => setCurrentStep('selection')}
        fontWeight="600"
      >
        <XStack ai="center" gap="$2">
            <IconComp name="home" size={16} color='$blue10' />
            <Text fontSize="$4" color='$blue10'>
              AI Combinator
            </Text>
        </XStack>
        
      </Button>

      <XStack ai="center" jc="flex-end">
        <YStack ai="flex-start" gap="$1">
          <Text fontSize="$4" color='$color10' fontWeight="600">
            Use Case:
          </Text>
          <XStack gap={5} ai="center">
            <Text fontSize="$4" color='$blue8'>
              {currentUseCase.title || ''}
            </Text>
            <Text
              fontSize="$4"
              color="$blue10"
              fontWeight="400"
              textDecorationLine="underline"
              cursor="pointer"
              onPress={() => setShowUseCaseSheet(true)}
            >
              edit
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </XStack>
          {/* Use Case Selection Sheet */}
      <UseCaseSheet
        open={showUseCaseSheet}
        onOpenChange={setShowUseCaseSheet}
        currentUseCaseId={currentUseCase?.id || '0'}
        onUseCaseSelect={handleUseCaseSelect}
      />
      </>
  )
}