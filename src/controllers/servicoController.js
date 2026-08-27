const {
    Servico,
    TipoServico
} = require('../models');

async function criarServico(req,res){
    try{
        let {
            id_tipo_servico,
            nome_cliente,
            tipo_veiculo,
            placa,
            preco,
        } = req.body;

        //usuario vem do jwt
        const id_usuario = req.usuario.id_usuario

        //tratamento
        id_tipo_servico = Number(id_tipo_servico)

        nome_cliente = nome_cliente?.trim();
        tipo_veiculo = tipo_veiculo?.trim();
        placa = placa?.trim().toUpperCase();
        preco = Number(preco);

        //validacoes

        if(!Number.isInteger(id_tipo_servico) ||id_tipo_servico <= 0) {
            return res.status(400).json({
                erro: 'Tipo de serviço inválido.'
            });
        }

        if (!nome_cliente) {
            return res.status(400).json({
                erro: 'O nome do cliente é obrigatório.'
            });
        }

        if (!tipo_veiculo) {
            return res.status(400).json({
                erro: 'O tipo de veículo é obrigatório.'
            });
        }

        if (!placa) {
            return res.status(400).json({
                erro: 'A placa do veículo é obrigatória.'
            });
        }

        const regexPlaca = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/;

        if (!regexPlaca.test(placa)) {
            return res.status(400).json({
                erro: 'Placa do veículo inválida.'
            });
        }

        if (!Number.isFinite(preco) ||preco < 0) {
            return res.status(400).json({
                erro: 'O preço deve ser um valor válido.'
            });
        }

        //verificar tipo de servico
        const tipoServico = await TipoServico.findByPk(
            id_tipo_servico
        )

        if (!tipoServico) {
            return res.status(404).json({
                erro: 'Tipo de serviço não encontrado.'
            });
        }

        const servico = await Servico.create({
            id_usuario,
            id_tipo_servico,
            nome_cliente,
            tipo_veiculo,
            placa,
            preco
        });

        return res.status(201).json({
            mensagem: 'Serviço registrado com sucesso.',servico
        });


    } catch (error){
        console.error('Erro ao criar serviço:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function listarServicos(req,res){
    try{
        //tratamento de data
        const {Op} = require('sequelize');

        const {
            data_inicio,
            data_fim
        } = req.query

        const where = {};

        if(data_inicio || data_fim){
            where.data_servico = {}
        }

        if(data_inicio){
            const inicio = new Date(`${data_inicio}T00:00:00`);

            if(isNaN(inicio.getTime())){
                return res.status(400).json({
                    erro: 'data_inicio invalida'
                })
            }

            where.data_servico[Op.gte] = inicio
        }

        if(data_fim){
            const fim = new Date(`${data_fim}T23:59:59.999`)

            if(isNaN(fim.getTime())){
                return res.status(400).json({
                    erro: 'data_fim inválida'
                })
            }

            where.data_servico[Op.lte] = fim
        }

        //----------

        const servicos = await Servico.findAll({
            where,

            attributes:[
                'id_servico',
                'id_tipo_servico',
                'nome_cliente',
                'tipo_veiculo',
                'placa',
                'data_servico',
                'preco'
            ],

            include: [
                {
                    model: TipoServico,
                    as: 'tipoServico',
                    attributes: [
                        'id_tipo_servico',
                        'nome'
                    ]
                }
            ],

            order:[['data_servico', 'DESC']]
        })

        return res.status(200).json(servicos);

    } catch (error){
        console.error('Erro ao listar serviços:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function buscarServico(req,res){
    try{
        const {id} = req.params;

        const servico = await Servico.findByPk(id,{
            attributes:[
                'id_servico',
                'id_tipo_servico',
                'nome_cliente',
                'tipo_veiculo',
                'placa',
                'data_servico',
                'preco'
            ],

            include: [
                {
                    model: TipoServico,
                    as: 'tipoServico',
                    attributes: [
                        'id_tipo_servico',
                        'nome'
                    ]
                }
            ]
        });

        if (!servico) {
            return res.status(404).json({
                erro: 'Serviço não encontrado.'
            });
        }

        return res.status(200).json(servico)
    } catch (error){
        console.error('Erro ao buscar serviço:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function atualizarServico(req,res){
    try{
        const {id} = req.params;

        let {
            id_tipo_servico,
            nome_cliente,
            tipo_veiculo,
            placa,
            preco,
        } = req.body;

        const servico = await Servico.findByPk(id);

        if (!servico) {
            return res.status(404).json({
                erro: 'Serviço não encontrado.'
            });
        }

        id_tipo_servico = Number(id_tipo_servico)

        nome_cliente = nome_cliente?.trim();
        tipo_veiculo = tipo_veiculo?.trim();
        placa = placa?.trim().toUpperCase();

        preco = Number(preco);

        if (!Number.isInteger(id_tipo_servico) || id_tipo_servico <= 0) {
            return res.status(400).json({
                erro: 'Tipo de serviço inválido.'
            });
        }

        if (!nome_cliente) {
            return res.status(400).json({
                erro: 'O nome do cliente é obrigatório.'
            });
        }

        if (!tipo_veiculo) {
            return res.status(400).json({
                erro: 'O tipo de veículo é obrigatório.'
            });
        }

        if (!placa) {
            return res.status(400).json({
                erro: 'A placa do veículo é obrigatória.'
            });
        }

        if (!Number.isFinite(preco) || preco < 0) {
            return res.status(400).json({
                erro: 'O preço deve ser um valor válido.'
            });
        }

        const tipoServico = await TipoServico.findByPk(
            id_tipo_servico
        );

        if (!tipoServico) {
            return res.status(404).json({
                erro: 'Tipo de serviço não encontrado.'
            });
        }

        //atualiza servico
        await servico.update({
            id_tipo_servico,
            nome_cliente,
            tipo_veiculo,
            placa,
            preco
        })

        return res.status(200).json({
            mensagem: 'Serviço atualizado com sucesso.',servico
        });

    } catch (error){
        console.error('Erro ao atualizar serviço:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function excluirServico(req, res) {
    try {

        const { id } = req.params;

        const servico = await Servico.findByPk(id);

        if (!servico) {
            return res.status(404).json({
                erro: 'Serviço não encontrado.'
            });
        }

        //EXCLUI
        await servico.destroy();

        return res.status(200).json({
            mensagem: 'Serviço excluído com sucesso.'
        });

    } catch (error) {
        console.error('Erro ao excluir serviço:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function resumoServicos(req,res){
    try{
        //data
        const {Op, fn, col} = require('sequelize');
        
        const {
            data_inicio,
            data_fim
        } = req.query;

        if(!data_inicio || !data_fim){
            return res.status(400).json({
                erro: 'data_inicio e data_fim sao obrigatórias'
            })
        }

        const inicio = new Date(`${data_inicio}T00:00:00`);
        const fim = new Date(`${data_fim}T23:59:59.999`);

        if(isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
            return res.status(400).json({
                erro: 'Data inválida'
            })
        }

        if(inicio > fim){
            return res.status(400).json({
                erro: 'A data_inicio não pode ser maior que a data_fim'
            })
        }

        //calcula o total
        const resumo = await Servico.findOne({
            where: {
                data_servico: {
                    [Op.between]: [
                        inicio,
                        fim
                    ]
                }
            },

            attributes: [
                [fn('COUNT', '*'), 'total_servicos'],
                [fn('SUM', col('preco')), 'valor_total']
            ],

            raw: true
        })

        //busca lista de servicos
        const servicos = await Servico.findAll({
            where: {
                data_servico: {
                    [Op.between]: [
                        inicio,
                        fim
                    ]
                }
            },

            attributes: [
                'id_servico',
                'id_tipo_servico',
                'nome_cliente',
                'tipo_veiculo',
                'placa',
                'data_servico',
                'preco'
            ],

            include: [
                {
                    model: TipoServico,
                    as: 'tipoServico',
                    attributes: [
                        'id_tipo_servico',
                        'nome'
                    ]
                }
            ],
            
            order:[['data_servico' , 'DESC']]
        
        })

        return res.status(200).json({
            data_inicio,
            data_fim,
            total_servicos: Number(resumo.total_servicos),
            valor_total: Number(resumo.valor_total || 0).toFixed(2),
            servicos
        })

    } catch (error){
        console.error('Erro ao gerar resumo dos serviços:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}

async function resumoServicoDiario(req,res) {
    try{

        const {Op} = require('sequelize');

        const inicioDia = new Date();
        inicioDia.setHours(0,0,0,0);

        const fimDia = new Date();
        fimDia.setHours(23,59,59,999);

        const servicos = await Servico.findAll({
            where:{
                data_servico: {
                    [Op.between]: [
                        inicioDia,fimDia
                    ]
                }
            },

            attributes: [
                'id_servico',
                'id_tipo_servico',
                'nome_cliente',
                'tipo_veiculo',
                'placa',
                'data_servico',
                'preco'
            ],

            include: [
                {
                    model: TipoServico,
                    as: 'tipoServico',
                    attributes: [
                        'id_tipo_servico',
                        'nome'
                    ]
                }
            ],

            order: [['data_servico', 'DESC']]
        });

        const totalServicos = servicos.length;

        const valorTotal = servicos.reduce(
            (total,servico) =>{
                return total + Number(servico.preco)
            },0
        )

        return res.status(200).json({
            data: inicioDia.toISOString().split('T')[0],

            totalServicos: totalServicos,
            valor_total: valorTotal.toFixed(2),
            servicos
        })


    } catch (error){
        console.error('Erro ao buscar resumo dos serviços:',error);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });
    }
}



module.exports = {
    criarServico,
    listarServicos,
    buscarServico,
    atualizarServico,
    excluirServico,
    resumoServicos,
    resumoServicoDiario
}