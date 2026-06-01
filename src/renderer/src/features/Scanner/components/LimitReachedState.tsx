import { Sparkles, FolderOpen, KeyRound } from 'lucide-react'
import type { ScanLimit } from '@shared/ipc'
import EmptyState from '../../../components/EmptyState'
import { PrimaryButton } from '../../../components/PrimaryButton'
import { useNavigation } from '../../../context/navigation'

interface LimitReachedStateProps {
  limit: ScanLimit
  onChooseFolder: () => void
}

export function LimitReachedState({
  limit,
  onChooseFolder
}: LimitReachedStateProps): React.JSX.Element {
  const { setActiveTab } = useNavigation()

  return (
    <EmptyState
      warm
      icon={<Sparkles size={34} strokeWidth={1.4} className="text-primary-600" />}
      title="This folder needs a license"
      body={
        <>
          That folder holds{' '}
          <span className="font-semibold text-surface-700">{limit.photoCount} photos</span>. Free
          use is capped at {limit.photoLimit} per scan. Activate a license for unlimited local
          scanning — no files are ever moved or changed.
        </>
      }
      footer={
        <div className="flex flex-col items-center gap-3">
          <PrimaryButton onClick={() => setActiveTab('settings')}>
            <KeyRound size={15} strokeWidth={2} />
            Activate License
          </PrimaryButton>
          <button
            type="button"
            onClick={onChooseFolder}
            className="flex items-center gap-1.5 text-[12px] font-medium text-surface-500 hover:text-primary-600 cursor-pointer transition-colors duration-150"
          >
            <FolderOpen size={13} strokeWidth={2} />
            Choose a smaller folder
          </button>
        </div>
      }
    />
  )
}
