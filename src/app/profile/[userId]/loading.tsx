export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="animate-pulse">
          {/* Cover Image */}
          <div className="h-48 bg-neutral-200 rounded-lg mb-8" />

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column */}
            <div className="w-full md:w-1/3 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-20 h-20 bg-neutral-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-neutral-200 rounded w-full" />
                <div className="mt-6 space-y-4">
                  <div className="h-20 bg-neutral-200 rounded" />
                  <div className="h-16 bg-neutral-200 rounded" />
                  <div className="h-16 bg-neutral-200 rounded" />
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-8 bg-neutral-200 rounded mb-2" />
                    <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto" />
                  </div>
                  <div>
                    <div className="h-8 bg-neutral-200 rounded mb-2" />
                    <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-full md:w-2/3">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <div className="h-8 bg-neutral-200 rounded w-1/4" />
                </div>
                <div className="p-6 space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                      <div className="h-6 bg-neutral-200 rounded w-3/4" />
                      <div className="h-4 bg-neutral-200 rounded w-full" />
                      <div className="h-4 bg-neutral-200 rounded w-5/6" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
