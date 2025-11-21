'use client'

import { Dialog, YStack, Text, Button } from 'tamagui'

export function ComingSoon({
  showUnavailableModal,
  setShowUnavailableModal,
}: {
  showUnavailableModal: boolean
  setShowUnavailableModal: (value: boolean) => void
}) {



  return (
    <Dialog modal open={showUnavailableModal}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          p="$6"
          maxWidth={500}
        >
          <Dialog.Title size="$6" color="$color">
            Download the binary from GitHub and add your ENV variables for AI Models to compare them side by side.
          </Dialog.Title>

          <Dialog.Description size="$4" color="$color075" lineHeight="$2">
            {`This application has not been released yet. If I see traffic to the open source project pick up, I'll step up dev on the commercial version.`}
          </Dialog.Description>

          <YStack gap="$2">
            <Text color="$color075" fontSize="$3">
              Current status: Under development
            </Text>
            <Text color="$color075" fontSize="$3">
              Expected availability: Coming soon
            </Text>
          </YStack>

          <Button
            theme="active"
            onPress={() => setShowUnavailableModal(false)}
            aria-label="Close modal"
          >
            Close
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}