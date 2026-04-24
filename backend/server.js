const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.post("/bfhl", (req, res) => {

    const data = req.body.data || [];

    const invalid_entries = [];
    const duplicates = [];

    const seen = new Set();
    const unique_sets = [];

    const CPMap = {};

    // Step1 - Validation

    for (let i of data) {

        i = i.trim();

        const regex = /^[A-Z]->[A-Z]$/;

        if (!regex.test(i)) {
            invalid_entries.push(i);
            continue;
        }

        const [parent, child] = i.split("->");

        // self loop
        if (parent === child) {
            invalid_entries.push(i);
            continue;
        }

        // duplicate edges
        if (seen.has(i)) {

            if (!duplicates.includes(i)) {
                duplicates.push(i);
            }

            continue;
        }

        seen.add(i);

        // multi parent handling
        if (CPMap[child]) {
            continue;
        }

        CPMap[child] = parent;

        unique_sets.push([parent, child]);
    }

    // Step2 - Graph Building

    const graphs = {};

    const allN = new Set();
    const childSet = new Set();

    for (const [parent, child] of unique_sets) {

        if (!graphs[parent]) {
            graphs[parent] = [];
        }

        graphs[parent].push(child);

        allN.add(parent);
        allN.add(child);

        childSet.add(child);
    }

    // Step3 - Root Identifying

    let roots = [...allN].filter(
        n => !childSet.has(n)
    );

    // pure cycle fallback

    if (roots.length === 0 && allN.size > 0) {
        roots = [[...allN].sort()[0]];
    }

    // Step4 - build tree

    function buildtree(node) {

        const result = {};

        for (const child of (graphs[node] || [])) {

            result[child] = buildtree(child);

        }

        return result;
    }

    // Step5 - Depth

    function depth(node) {

        if (
            !graphs[node] ||
            graphs[node].length === 0
        ) {
            return 1;
        }

        const childDepths =
            graphs[node].map(depth);

        return Math.max(...childDepths) + 1;
    }

    // Step6 - cycle detection

    function detectcycle(
        node,
        visiting = new Set(),
        visited = new Set()
    ) {

        if (visiting.has(node)) {
            return true;
        }

        if (visited.has(node)) {
            return false;
        }

        visiting.add(node);

        for (const child of (graphs[node] || [])) {

            if (
                detectcycle(
                    child,
                    visiting,
                    visited
                )
            ) {
                return true;
            }
        }

        visiting.delete(node);

        visited.add(node);

        return false;
    }

    // Step7 - results

    const heirarchies = [];

    let tot_trees = 0;
    let tot_cyc = 0;

    let largest_treeroot = "";
    let maxdpthfnd = 0;

    for (const r of roots) {

        const cyc = detectcycle(r);

        if (cyc) {

            tot_cyc++;

            heirarchies.push({

                root: r,

                tree: {},

                has_cycle: true

            });

        } else {

            tot_trees++;

            const tree = {};

            tree[r] = buildtree(r);

            const dpth = depth(r);

            if (
                dpth > maxdpthfnd ||
                (
                    dpth === maxdpthfnd &&
                    r < largest_treeroot
                )
            ) {

                largest_treeroot = r;

                maxdpthfnd = dpth;
            }

            heirarchies.push({

                root: r,

                tree: tree,

                depth: dpth

            });
        }
    }

    // final response

    res.json({
        hierarchies: heirarchies,

        invalid_entries,

        duplicate_edges: duplicates,

        summary: {

            total_trees: tot_trees,

            total_cycles: tot_cyc,

            largest_tree_root: largest_treeroot

        }

    });

});

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});