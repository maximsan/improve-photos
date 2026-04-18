import type { MoveOperation } from '@shared/ipc'

export interface TreeNode {
  name: string
  children: Map<string, TreeNode>
  ops: MoveOperation[]
}

export function buildTree(ops: MoveOperation[]): TreeNode {
  const root: TreeNode = { name: '', children: new Map(), ops: [] }
  for (const op of ops) {
    const parts = op.targetPath.split('/').filter(Boolean)
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]
      if (!node.children.has(seg)) {
        node.children.set(seg, { name: seg, children: new Map(), ops: [] })
      }
      const next = node.children.get(seg)
      if (next) {
        node = next
      }
    }
    node.ops.push(op)
  }
  return root
}

/** Returns the last N path segments for compact display. */
export function shortPath(fullPath: string, segments = 4): string {
  const parts = fullPath.split('/')
  return parts.slice(-segments).join('/')
}
