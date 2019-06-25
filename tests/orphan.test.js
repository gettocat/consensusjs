/**
Main    Side
block0
block1
block2
block3  block3.1 @add To sidechain, chech height
block4  block4.1 @add To sidechain, check height
	    block5.1 @add To sidechain, check height<-- mainChain, change chains for blocks (block3.1, block4.1, block5.1 -> main, block3, block4 -> sidechain)



Main    Side    Orphan
block0
block1
block2
block3
block4          block4.1 (parent block3.1, dont have in mainchain and sidechain now) @request block4.1#parent
        block5.1 @add to sidechain, check height <-- mainChain if have block4.1#parent
		block3.1 @add to sidechain, check height, change chains.

check height:
	return (get childs of block + get parents until main chain, get sum)
 */



