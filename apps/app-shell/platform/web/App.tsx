import { useCallback, useRef, useState } from 'react'
import './App.css'
import { ConfirmModal } from './components/ConfirmModal.js'
import { HostPanel } from './components/HostPanel.js'

type ModalState = {
  title: string
  message: string
  resolve: (allowed: boolean) => void
}

export function App() {
  const [modal, setModal] = useState<ModalState | null>(null)
  const modalRef = useRef<ModalState | null>(null)

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const state: ModalState = { title, message, resolve }
      modalRef.current = state
      setModal(state)
    })
  }, [])

  const handleModalResult = useCallback((allowed: boolean) => {
    modalRef.current?.resolve(allowed)
    modalRef.current = null
    setModal(null)
  }, [])

  return (
    <>
      <HostPanel confirm={confirm} />
      <ConfirmModal
        open={modal !== null}
        title={modal?.title ?? ''}
        message={modal?.message ?? ''}
        onResult={handleModalResult}
      />
    </>
  )
}
