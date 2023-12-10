import { useEffect, useState, useRef } from 'react'

function Content() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectionText, setSelectionText] = useState<string>();
  const [selectionBoundingBox, setSelectionBoundingBox] = useState<DOMRect>();
  const [scrollTop, setScrollTop] = useState<number>(0);

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = () => {
      setIsOpen(true);
    }
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [])

  useEffect(() => {
    const updateSelection = () => {
      if (isOpen) return;
      const selection = document.getSelection()
      setSelectionText(selection?.toString())
      if (selection?.rangeCount) {
        setSelectionBoundingBox(selection.getRangeAt(0).getBoundingClientRect())
        setScrollTop(window.scrollY)
      } else {
        setSelectionBoundingBox(undefined);
      }
    }
    document.addEventListener("selectionchange", updateSelection);
    return () => document.removeEventListener("selectionchange", updateSelection);
  }, [isOpen])

  useEffect(() => {
    if (!popupRef) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current?.contains(e.target as Node) || e.target === popupRef.current) return;
      setIsOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [popupRef])

  const popupTop = selectionBoundingBox ? selectionBoundingBox.top + scrollTop : 0;
  const popupLeft = selectionBoundingBox ? Math.min(selectionBoundingBox.left + selectionBoundingBox.width + 10, window.innerWidth - 500) : 0;
  return (
    isOpen && <div
      ref={popupRef}
      css={{
        position: 'absolute',
        top: popupTop,
        left: popupLeft,
        zIndex: Math.max,
        backgroundColor: 'white',
        color: 'black',
        border: '1px solid grey',
        padding: '25px',
        borderRadius: '5px',
        fontSize: '20px',
        fontFamily: 'Sans-Serif'
      }}
    >
      {selectionText}
    </div>
  )
}

export default Content
