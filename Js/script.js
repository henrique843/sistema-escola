const app = {
    data: {
        students: [],
        degrees: [],
        classes: []
    },
    editingId: null,
    chartInstance: null,

    init: async function() {
        try {
            const [resDeg, resCla] = await Promise.all([
                fetch('./Json/degrees.json'),
                fetch('./Json/classes.json')
            ]);
            
            this.data.degrees = await resDeg.json();
            
            const classObj = await resCla.json();
            this.data.classes = classObj.classes; 

            // 2. Carrega Alunos (Cache ou JSON)
            const storedStudents = localStorage.getItem('studentsDB');
            if (storedStudents) {
                this.data.students = JSON.parse(storedStudents);
            } else {
                const resStu = await fetch('./Json/students.json');
                this.data.students = await resStu.json();
                // Salva estado inicial
                localStorage.setItem('studentsDB', JSON.stringify(this.data.students));
            }

            this.populateFilters();
            this.renderTable();
            this.initChart();
            this.addEventListeners();

        } catch (error) {
            console.error(error);
            alert("Erro ao carregar dados. Verifique o Live Server.");
        }
    },

    // --- Helpers ---
    getDegreeName: function(id) {
        const d = this.data.degrees.find(x => x.id == id);
        return d ? d.name : 'Desc.';
    },
    getClassName: function(id) {
        // Como classes não tem ID, usamos: ID 1 = Index 0 ("A")
        const index = id - 1;
        return this.data.classes[index] ? this.data.classes[index].name : 'Desc.';
    },

    // --- DOM ---
    populateFilters: function() {
        const selDegree = document.getElementById('filterDegree');
        const selClass = document.getElementById('filterClass');

        this.data.degrees.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.name;
            selDegree.appendChild(opt);
        });

        // Gera IDs fictícios para as classes (1, 2, 3...) baseados no índice
        this.data.classes.forEach((c, index) => {
            const opt = document.createElement('option');
            opt.value = index + 1; 
            opt.textContent = c.name;
            selClass.appendChild(opt);
        });
    },

    addEventListeners: function() {
        document.getElementById('filterDegree').addEventListener('change', () => this.renderTable());
        document.getElementById('filterClass').addEventListener('change', () => this.renderTable());
        document.getElementById('btnGenerate').addEventListener('click', () => this.generateStudents());
    },

    renderTable: function() {
        const tbody = document.getElementById('studentsTableBody');
        const fDegree = document.getElementById('filterDegree').value;
        const fClass = document.getElementById('filterClass').value;

        tbody.innerHTML = '';

        const filtered = this.data.students.filter(s => {
            const matchDegree = fDegree === "" || s.degreeId == fDegree;
            const matchClass = fClass === "" || s.classId == fClass;
            return matchDegree && matchClass;
        });

        if(filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum aluno encontrado.</td></tr>';
            return;
        }

        filtered.forEach(s => {
            const tr = document.createElement('tr');
            
            if (this.editingId === s.id) {
                // Modo Edição
                tr.innerHTML = `
                    <td>${s.ra}</td>
                    <td><input type="text" id="editName-${s.id}" value="${s.name}" class="edit-input"></td>
                    <td>
                        <select id="editDegree-${s.id}" class="edit-input">
                            ${this.data.degrees.map(d => `<option value="${d.id}" ${d.id == s.degreeId ? 'selected':''}>${d.name}</option>`).join('')}
                        </select>
                    </td>
                    <td>
                        <select id="editClass-${s.id}" class="edit-input">
                            ${this.data.classes.map((c, i) => `<option value="${i+1}" ${i+1 == s.classId ? 'selected':''}>${c.name}</option>`).join('')}
                        </select>
                    </td>
                    <td><button class="btn-save" onclick="app.saveStudent(${s.id})">Salvar</button></td>
                `;
            } else {
                // Modo Leitura
                tr.innerHTML = `
                    <td>${s.ra}</td>
                    <td>${s.name}</td>
                    <td>${this.getDegreeName(s.degreeId)}</td>
                    <td>Turma ${this.getClassName(s.classId)}</td>
                    <td><button class="btn-edit" onclick="app.editStudent(${s.id})">Editar</button></td>
                `;
            }
            tbody.appendChild(tr);
        });
    },

    editStudent: function(id) {
        this.editingId = id;
        this.renderTable();
    },

    saveStudent: function(id) {
        const name = document.getElementById(`editName-${id}`).value;
        const degreeId = parseInt(document.getElementById(`editDegree-${id}`).value);
        const classId = parseInt(document.getElementById(`editClass-${id}`).value);

        const student = this.data.students.find(s => s.id === id);
        if(student) {
            student.name = name;
            student.degreeId = degreeId;
            student.classId = classId;
        }
        this.editingId = null;
        this.persistData();
    },

    generateStudents: function() {
        const count = 300;
        let lastId = this.data.students.length > 0 ? Math.max(...this.data.students.map(s => s.id)) : 0;

        for(let i=0; i<count; i++) {
            lastId++;
            const rndDegree = this.data.degrees[Math.floor(Math.random() * this.data.degrees.length)];
            // Gera ID da turma aleatório baseado no tamanho do array de classes
            const rndClassId = Math.floor(Math.random() * this.data.classes.length) + 1;

            this.data.students.push({
                id: lastId,
                ra: Math.floor(Math.random() * 899999) + 100000,
                name: `Aluno Gerado ${lastId}`,
                degreeId: rndDegree.id,
                classId: rndClassId
            });
        }
        this.persistData();
    },

    persistData: function() {
        localStorage.setItem('studentsDB', JSON.stringify(this.data.students));
        this.renderTable();
        this.updateChart();
    },

    initChart: function() {
        const ctx = document.getElementById('distributionChart').getContext('2d');
        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Alunos por Série',
                    data: [],
                    backgroundColor: '#3498db'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        this.updateChart();
    },

    updateChart: function() {
        const counts = {};
        this.data.degrees.forEach(d => counts[d.name] = 0);
        this.data.students.forEach(s => {
            const dName = this.getDegreeName(s.degreeId);
            if(counts[dName] !== undefined) counts[dName]++;
        });
        this.chartInstance.data.labels = Object.keys(counts);
        this.chartInstance.data.datasets[0].data = Object.values(counts);
        this.chartInstance.update();
    }
};
app.init();