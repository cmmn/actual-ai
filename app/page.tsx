'use client'

import { YStack, Dialog, Text, Button } from 'tamagui'
import { useState, useEffect } from 'react'
import { ModelController } from '../components/ModelController'

export default function Home() {
  const [showUnavailableModal, setShowUnavailableModal] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)

  // Check if app is available
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const response = await fetch('/api/status')
        const data = await response.json()
        if (data.isAvailable !== 'true') {
          setIsAvailable(false)
        } else {
          setIsAvailable(true)
        }
      } catch (error) {
        console.error('Error checking app availability:', error)
        // If we can't check status, assume unavailable
        setIsAvailable(false)
      }
    }

    checkAvailability()
  }, [])


  return (
    <>
      {/* Unavailable App Modal */}
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
              Coming soon!
            </Dialog.Title>

            <Dialog.Description size="$4" color="$color075" lineHeight="$2">
              This application has not been released yet. Please check back in a few days to see if the status has been updated.
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

      <YStack
        theme='blue'
        mt={20}
        br={20}
        mx='auto'
        width="100%"
        padding="$10"
        gap={'$5'}
        backgroundColor="$background"
        jc='center'
        ai='center'
        ac='center'
      >
        <ModelController
          isAvailable={isAvailable}
          onUnavailable={() => setShowUnavailableModal(true)}
        />
      </YStack>
    </>
  )
}

/* original code
<div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Get started by editing <code>app/page.tsx</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div> 
*/