'use client'
import TenantOutsidePortalNav from '@/components/navigation/TenantOutsidePortalNav'
import { useEffect, useState } from 'react'

type Post = {
    id: number
    author: string
    content: string
    createdAt: string
    comments: { id: number; author: string; content: string }[]
}

export default function FeedsPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [newPost, setNewPost] = useState('')
    const [loading, setLoading] = useState(false)

    const fetchPosts = async () => {
        const res = await fetch('/api/feeds')
        const data = await res.json()
        setPosts(data)
    }

    const handlePost = async () => {
        if (!newPost.trim()) return
        setLoading(true)
        await fetch('/api/feeds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newPost }),
        })
        setNewPost('')
        setLoading(false)
        fetchPosts()
    }

    useEffect(() => {
        fetchPosts()
    }, [])

    return (
        <div className="flex min-h-screen">
            <TenantOutsidePortalNav />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
            <div className="bg-white border p-4 rounded shadow">
        <textarea
            className="w-full border p-2 rounded resize-none"
            placeholder="What's on your mind?"
            rows={3}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
        />
                <div className="text-right mt-2">
                    <button
                        onClick={handlePost}
                        className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>

            {posts.map((post) => (
                <div key={post.id} className="bg-white border rounded p-4 shadow space-y-2">
                    <div className="text-sm text-gray-500">{post.author}</div>
                    <div className="text-gray-800 whitespace-pre-wrap">{post.content}</div>
                    <div className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</div>

                    {post.comments.length > 0 && (
                        <div className="mt-2 border-l pl-4 space-y-1">
                            {post.comments.map((comment) => (
                                <div key={comment.id} className="text-sm text-gray-700">
                                    <span className="font-semibold">{comment.author}:</span> {comment.content}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
        </div>
    )
}
