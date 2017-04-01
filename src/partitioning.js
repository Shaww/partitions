function factorial (n) {
  // factorial of 0 is 1
  let fact = 1

  while (n > 0) {
    fact = fact * n
    n--
  }

  return fact
}


/*
 * Calculates the number of permutations of k-subsets of n sample space
 *
 * runs is an array. The value at each index representing the number of
 * times an item in the event sample is repeated. The number of repetition
 * is not mapped to any particular item as it is not important, it is the
 * number of repitition and not which item is repeated x times that is
 * important.
 */
function permutationCount (n, runs, k) {
  let factN, factNMinusK, repeatedFacts

  factN         = factorial(n)
  factNMinusK   = factorial(n - k)

  repeatedFacts = runs.reduce((product, run) => product * factorial(run), 1)

  return factN / (factNMinusK * repeatedFacts)
}

/*
 * Creates (n - 1) + 2 new lists by prepending a given item to each of the
 * elements in xs. The new lists will have the item prepended to elements
 * at index 0, 1, ..., n. Additionally a final list is created by appending
 * the item to the last element of the xs.
 *
 * Returns a list of lists.
 */
function insertItem (x, xs) {
  let inserted = [], len = xs.length

  for (let i=0; i<=len; i++) {
    let _xs = copyArray(xs)
    _xs.splice(i, 0, x)

    inserted.push(_xs)
  }
  return inserted
}


/*
 * Returns the permutations of a given event sample
 *
 * items is the list of elements in the event sample.
 */
function permutations (items) {
  if (items.length === 0) {
    return []
  }

  let allPermutations = [[]]

  for (let item of items) {
    let build = []

    for (let p of allPermutations) {
      let _newPermutations = insertItem(item, p)

      _newPermutations.forEach((_p) => build.push(_p))
    }

    allPermutations = build
  }

  return allPermutations
}


/*
 * Returns the sequences of a given event sample if the each event can be
 * represent by one of the items in the sample(i.e., we are allowed to
 * repeat with the same item)
 */
function sequences (items, n, seq=[[]]) {
  if (n === 0) return []

  let allSequences = seq

  while (n > 0) {
    let build = []

    for (let sequence of allSequences) {
      for (let item of items) {
        let _sequence = copyArray(sequence)

        _sequence.push(item)
        build.push(_sequence)
      }
    }

    allSequences = build
    n--
  }

  return allSequences
}


/*
 * returns a string representation of the partitions from an distribution array
 */
function partitionString (distributions) {
  let repr = '', reduced

  reduced = distributions.reduce((fragment, items) => {
    // fragment is the current string representation being built up.
    // items is the number of items in the current partition.
    let partitionFragment = 'X '.repeat(items)

    return `${fragment }| ${partitionFragment}`
  }, repr)

  return `${reduced}|`
}


 /*
  * Class modelling state of partitions. A partition being a container for items.
  * Multiple of such containers forming the partitions state. Ordering of the
  * partitions have semantic meaning.
  */
class Partitions {
  constructor (types, slots, distributions, from, to) {
    /* types is an array of Integers. The number indicates the upper limit of
    * what is considered a success value.
    *
    * slots is an array of Integers. The value of which is the number of items
    * it can hold for that particular partition.
    *
    * distributions is an array of Integers. The value at each index is the
    * number of items populating the partition at that index.
    */

    this.types          = types
    this.slots          = slots
    this.distributions  = distributions
    this.from           = from
    this.to             = to
  }

  /*
   * Returns string representation of the partitions state.
   */
  toString () {
    return partitionString(this.distributions)
  }
}


/*
 * Clones an array of primitives
 */
function copyArray (array) {
  return array.slice()
}


/*
 * Clones a Partitions object
 */
function clonePartitions (partitions) {
  let ts, slts, ds, from, to

  ts    = copyArray(partitions.types)
  slts  = copyArray(partitions.slots)
  ds    = copyArray(partitions.distributions)
  from  = partitions.from
  to    = partitions.to

  return new Partitions(ts, slts, ds, from, to)
}


/*
 * Returns a list of moves(in the form of Partitions objects) that can be made
 * by removing items from a given partition, and moving that item to partitions
 * starting from a given destination partition.
 */
function movesFrom (partitions) {
  let from, to, len, moves

  from  = partitions.from
  to    = partitions.to
  len   = partitions.distributions.length
  moves = []

  if (from === to) {
    to += 1
  }

  for (let i=to; i<len; i++) {
    let slotsAvail, nItemsFrom, nItemsTo, ds, ts, slts

    // copy of the types, slots and distribution arrays
    ts          = copyArray(partitions.types)
    slts        = copyArray(partitions.slots)
    ds          = copyArray(partitions.distributions)

    slotsAvail  = slts[i]
    nItemsFrom  = ds[from]
    nItemsTo    = ds[i]

    // guard clause to break out early.
    if (nItemsFrom === 0) {
      break
    }

    // if there is space to move an item into
    if (nItemsTo + 1 <= slotsAvail) {
      let _partitions

      // remove from one partition and move it to the another
      ds[from] -= 1
      ds[i]   += 1

      _partitions  = new Partitions(ts, slts, ds, from, i)
      moves.push(_partitions)
    }
  }

  return moves
}


/*
 * Returns a list of all moves(in the form of Partitions objects) that can be
 * made by calling movesFrom(), the Partitions object used in the argument will
 * have a 'from' property. This is the where an item is to be moved from.
 * We want to find all the moves that can be created starting from 'from', then
 * the index 'from - 1', 'from - 1' to index 0.
 */
function movesUptoFrom (partitions) {
  let fromStart, to, allMoves, _partitions

  fromStart   = partitions.from
  to          = partitions.to
  allMoves    = []
  _partitions = clonePartitions(partitions)

  for (let i=fromStart; i>=0; i--) {
    let moves

    _partitions.from = i

    moves = movesFrom(_partitions)

    for (let move of moves) {
      allMoves.push(move)
    }
  }

  return allMoves
}


/*
 * Returns a list of states, where each state represents the distribution of
 * the items among the partitions.
 *
 * types, slots, initialDist are arrays of the same length.
 *
 * rightMost is the right most partition containing items for the given initial
 * state.
 */
function partitionMoves (types, slots, initialDist, rightMost) {
  let stack, partitions, len, states

  partitions  = new Partitions(types, slots, initialDist, rightMost, rightMost)
  len         = initialDist.length
  stack       = [partitions]
  states      = []

  while (stack.length > 0) {
    let _states, _partitions

    _partitions = stack.pop()
    states.push(_partitions)

    _states = movesUptoFrom(_partitions)
    _states.forEach((s) => stack.unshift(s))
  }

  return states
}


/*
 * Returns the probability of the a sequence of events as represented by a
 * given distributions array.
 *
 * A slots array composed of [3, 2, 2] and a distributions array of [2, 0, 0]
 * is expanded to the following event sequence.
 *
 * [H, H, M | M M | M M]
 */
function eventProbability (types, slots, distributions) {
  let index = 0

  return distributions.reduce((product, nHits) => {
    let nMisses     = slots[index] - nHits,
        hitChance   = types[index] / 6,    // assume d6 die being used
        missChance  = 1 - hitChance

    index += 1

    return product * Math.pow(hitChance, nHits) * Math.pow(missChance, nMisses)
  }, 1)
}


/*
 * Returns the number of arrangments from a particular configuration of a
 * distributions array.
 *
 * For example, given the following configuration.
 *
 * slots [3, 2, 2]
 * distributions of [2, 0, 0]
 *
 * We know partition 1 has 2 hits and 1 miss - [H, H, M].
 * There are p(3, 3)/2! unique permutations from the event sample.
 *
 * [H, H, M]
 * [H, M, H]
 * [M, H, H]
 *
 * Similarly, partitions 2 and 3 have 2 misses, and there is only one way to
 * arrange a sequence where all the items are repetitions of each other.
 *
 * The product of these arrangement counts for each partition gives us
 *
 * 3 x 1 x 1 = 3
 *
 * So there are 3 sequences that contain hits distributed in it's first partition.
 *
 */
function arrangementCount (slots, distributions) {
  let i = 0

  return distributions.reduce((product, nHits) => {
    let nSlots  = slots[i],
        nMisses = nSlots - nHits,
        count   = permutationCount(nSlots, [nHits, nMisses], nSlots)

     i++

     return product * count
  }, 1)
}


/*
 * Returns the probability of getting x number of 'hits' for a given
 * composition(slot compostition).
 */
function hitsProbability (types, slots, nHits) {
  let initialDist   = distribute(nHits, slots),
      rightMost     = rightMostPartition(initialDist),
      states        = partitionMoves(types, slots, initialDist, rightMost)

  // states containing a list of Partitions objects, each object's distributions
  // array showing how the hits are distributed over 'slots' composition.

  return states.reduce((sum, partitions) => {
    let ts    = partitions.types,
        slts  = partitions.slots,
        ds    = partitions.distributions,
        eventProb     = eventProbability(ts, slts, ds),
        arrangements  = arrangementCount(slts, ds)

    return sum + (arrangements * eventProb)
  }, 0)
}


/*
 * Returns the probability of getting at least x number of 'hits' for a given
 * composition(slots being the makeup of that composition)
 */
function minHitsProbability (types, slots, minHits) {
  let maxHits = slots.reduce((s, n) => s + n, 0),
      prob    = 0

  for (let nHits=minHits; nHits<=maxHits; nHits++) {
    prob += hitsProbability(types, slots, nHits)
  }

  return prob
}


/**
 * @summary - Returns a distributions array(Integer Array) whose value at each
 * index represents how many of the given items are placed inside that current
 * partition.
 *
 * > [2, 1, 0] // this distributions array has 2 items in the first partition
 *	       // and 1 in the second. This represents how 3 items given are
 *	       // to be distributed. Only 2 items can exists in the first
 *	       // partition(this is constrained by the slots composition array
 *	       // given) 
 *
 * @function
 * @public
 *
 * @params {Integer} n - The number of items to distribute among the partitions.
 * @params {Integer []} composition - An array whose value at index i represents
 *  the maximium number of items that can exist inside parition i.
 *
 * @returns {Integer []}
 */
function distribute (n, composition) {
  let left = n

  // slots represents the maximium number of items that can be held inside a
  // partitular partition.
  return composition.reduce((distribution, slots) => {
    if (left > 0) {
      let diff = slots - left

      if (diff >= 0) {
        distribution.push(left)
        left = 0
      }
      else {
        distribution.push(slots)
        left = Math.abs(diff)
      }
    }
    else {
      distribution.push(0)
    }

    return distribution
  }, [])
}


/**
 * @summary - Returns the index of rightmost/highest/largest partition with
 * items in it. A partition has items in it if it has a value greater than 0.
 *
 * > [2, 0, 1, 0, 0]  // rightmost index is 2(zero-indexed)
 *
 * @function
 * @public
 *
 * @param {Integer []} distribution - How items(hits) are distributed. Each
 *  index is a partition, and the value at that index(partition) represents the
 *  number of items in it(partition)
 *
 * @returns Integer
 */
function rightMostPartition (distribution) {
  let rightmost	= -1
  const len	=distribution.length

  for(const i=len-1; i>=0; i--) {
    const n = distribution[i] 

    if (n > 0) {
      rightmost = i 
      break
    } 
  }

  if (rightmost === -1) {
    throw Error('Unable to find rightmost index. Out of bounds error.') 
  }

  return rightmost
}



// testing

/**
  *let s3    = [4, 2, 12, 8]
  *let t3    = [1, 2, 3, 4]
  *let prob3 = minHitsProbability(t3, s3, 10)
  *
  *console.log(prob3)
  *
  *
  *let s4    = [50, 18, 6]
  *let t4    = [2, 3, 4]
  *let prob4 = minHitsProbability(t4, s4, 30)
  *
  *console.log(prob4)
  */

export {minHitsProbability}
