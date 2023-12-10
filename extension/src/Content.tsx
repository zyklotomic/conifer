import { useEffect, useState, useRef } from 'react'

function Content() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectionText, setSelectionText] = useState<string>();
  const [selectionBoundingBox, setSelectionBoundingBox] = useState<DOMRect>();
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [opinion, setOpinion] = useState<any>();

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'open') setIsOpen(true);
      if (message.type === 'opinion') setOpinion(message.data);
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
      setOpinion(undefined);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [popupRef])

  const popupTop = selectionBoundingBox ? selectionBoundingBox.top + scrollTop : 0;
  const popupLeft = selectionBoundingBox ? Math.min(selectionBoundingBox.left + selectionBoundingBox.width + 10, window.innerWidth - 500) : 0;
  const isLoading = isOpen && opinion === undefined;
  return (
    isOpen ? <div
      ref={popupRef}
      css={{
        position: 'absolute',
        top: popupTop,
        left: popupLeft,
        zIndex: Number.MAX_VALUE,
        backgroundColor: 'white',
        color: 'black',
        border: '1px solid grey',
        padding: '25px',
        borderRadius: '5px',
        fontSize: '20px',
        fontFamily: 'Sans-Serif',
        minWidth: '450px'
      }}
    >
      {
        isLoading
          ? 'Loading...'
          : selectionText
      }
    </div>
   : null
  )
}

export default Content
