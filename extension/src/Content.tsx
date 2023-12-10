import { useEffect, useState, useRef } from 'react'

function Content() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectionBoundingBox, setSelectionBoundingBox] = useState<DOMRect>();
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [opinionData, setOpinionData] = useState<any>();

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'open') setIsOpen(true);
      if (message.type === 'opinion') setOpinionData(message.data);
    }
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [])

  useEffect(() => {
    const updateSelection = () => {
      if (isOpen) return;
      const selection = document.getSelection()
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
      setOpinionData(undefined);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [popupRef])

  const popupTop = selectionBoundingBox ? selectionBoundingBox.top + scrollTop : 0;
  const popupLeft = selectionBoundingBox ? Math.min(selectionBoundingBox.left + selectionBoundingBox.width + 10, window.innerWidth - 500) : 0;
  const isLoading = isOpen && opinionData === undefined;
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
        paddingTop: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'Sans-Serif',
        minWidth: '450px',
        maxWidth: '600px'
      }}
    >
      {
        false
          ? 'Loading...?'
          : (
            <>
              <h2>Conifer's Opinion</h2>
              <p>{opinionData.opinion}</p>
              <h4>Additional Reading:</h4>
              <ul>
                {opinionData.sources.map((source: any) => 
                  <li key={source.uri}>
                    <a href={source.url} target='_blank'>{source.headline}</a>
                  </li>)
                }
              </ul>
            </>
          )
      }
    </div>
   : null
  )
}

export default Content
